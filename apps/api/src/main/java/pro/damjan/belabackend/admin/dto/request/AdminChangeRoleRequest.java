package pro.damjan.belabackend.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminChangeRoleRequest {
    @NotBlank(message = "Role is required")
    private String role;

    @NotBlank(message = "Username confirmation is required")
    private String confirmUsername;
}
